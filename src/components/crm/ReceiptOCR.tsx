'use client'
import { useState } from 'react'
import { useToast } from '@/components/Toast'

export function ReceiptOCR({ onDataExtracted }: { onDataExtracted: (data: any) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [extracted, setExtracted] = useState<any>(null)
  const { showToast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null
    setFile(f)
    if (f) {
      const reader = new FileReader()
      reader.onloadend = () => setPreview(reader.result as string)
      reader.readAsDataURL(f)
    }
  }

  const processOCR = async () => {
    if (!file) return
    setProcessing(true)
    showToast('Processing receipt...')

    try {
      const Tesseract = (await import('tesseract.js')).default

      const { data } = await Tesseract.recognize(file, 'eng', {
        logger: (info) => {
          if (info.status === 'recognizing text') {
            // Show progress
          }
        },
      })

      const text = data.text
      console.log('OCR Result:', text)

      // Parse the extracted text for bank transfer details
      const extractedData = parseBankReceipt(text)
      setExtracted(extractedData)
      onDataExtracted(extractedData)
      showToast('Receipt processed!')
    } catch (error) {
      showToast('OCR failed. Please enter details manually.', 'error')
    }
    setProcessing(false)
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
      <h4 className="font-semibold mb-3">🤖 Auto-Extract from Receipt</h4>
      <p className="text-sm text-gray-600 mb-3">
        Upload a screenshot of the bank transfer receipt and we'll extract the details
        automatically.
      </p>

      {!preview ? (
        <label className="flex flex-col items-center gap-2 cursor-pointer">
          <div className="w-full py-6 px-4 bg-white dark:bg-gray-800 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl text-center hover:bg-blue-50">
            <span className="text-3xl block mb-2">📸</span>
            <span className="text-blue-700 font-medium">Upload Receipt Screenshot</span>
          </div>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      ) : (
        <div className="space-y-3">
          <img
            src={preview}
            alt="Receipt"
            className="w-full h-40 object-contain rounded-lg border"
          />
          <div className="flex gap-2">
            <button
              onClick={processOCR}
              disabled={processing}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              {processing ? 'Processing...' : '🔍 Extract Details'}
            </button>
            <button
              onClick={() => {
                setFile(null)
                setPreview(null)
                setExtracted(null)
              }}
              className="px-4 py-2 bg-gray-200 rounded-lg text-sm"
            >
              Reset
            </button>
          </div>

          {extracted && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
              <p className="text-green-700 font-medium mb-2">✅ Extracted Details:</p>
              {extracted.bankFrom && <p>Bank: {extracted.bankFrom}</p>}
              {extracted.accountFrom && <p>Account: {extracted.accountFrom}</p>}
              {extracted.amount && <p>Amount: ${extracted.amount}</p>}
              {extracted.reference && <p>Reference: {extracted.reference}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Parse OCR text for common bank receipt patterns
function parseBankReceipt(text: string) {
  const result: any = {}

  // Look for bank names
  const banks = ['Heritage', 'Atlantic', 'Belize Bank', 'Scotiabank', 'First Caribbean']
  for (const bank of banks) {
    if (text.toLowerCase().includes(bank.toLowerCase())) {
      result.bankFrom = bank
      break
    }
  }

  // Look for account numbers (various patterns)
  const accountMatch = text.match(/(?:account|acct|a\/c)[\s#:]*(\d{6,})/i)
  if (accountMatch) result.accountFrom = accountMatch[1]

  // Look for amounts
  const amountMatch = text.match(/\$[\s]?([\d,]+\.?\d*)/)
  if (amountMatch) result.amount = amountMatch[1].replace(/,/g, '')

  // Look for reference numbers
  const refMatch = text.match(/(?:reference|ref|transaction|txn)[\s#:]*([A-Za-z0-9-]+)/i)
  if (refMatch) result.reference = refMatch[1]

  // Look for dates
  const dateMatch = text.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/)
  if (dateMatch) result.date = dateMatch[1]

  return result
}
