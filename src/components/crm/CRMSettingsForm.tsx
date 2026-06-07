'use client'
import { useState } from 'react'
import { useToast } from '@/components/Toast'

export function CRMSettingsForm({ settings }: { settings: any }) {
  const [collectionFeePercent, setCollectionFeePercent] = useState(
    settings?.fees?.collectionFeePercent ?? 20,
  )
  const [summonsFeeBelizeCity, setSummonsFeeBelizeCity] = useState(
    settings?.fees?.summonsFeeBelizeCity ?? 25,
  )
  const [summonsFeeOther, setSummonsFeeOther] = useState(settings?.fees?.summonsFeeOther ?? 50)
  const [courtFilingFee, setCourtFilingFee] = useState(settings?.fees?.courtFilingFee ?? 4)

  const [companyName, setCompanyName] = useState(
    settings?.receipt?.companyName ?? 'ISAME CREDIT COLLECTION LTD',
  )
  const [companyAddress, setCompanyAddress] = useState(
    settings?.receipt?.companyAddress ?? 'Belize City, Belize',
  )
  const [companyPhone, setCompanyPhone] = useState(settings?.receipt?.companyPhone ?? '')
  const [companyEmail, setCompanyEmail] = useState(settings?.receipt?.companyEmail ?? '')
  const [companyWebsite, setCompanyWebsite] = useState(
    settings?.receipt?.companyWebsite ?? 'www.isame.co',
  )
  const [receiptFooter, setReceiptFooter] = useState(
    settings?.receipt?.receiptFooter ??
      'This receipt acknowledges payment received toward the referenced account.',
  )

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(
    settings?.receipt?.receiptLogo?.url || null,
  )

  const [submitting, setSubmitting] = useState(false)
  const { showToast } = useToast()

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setLogoFile(file)
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setLogoPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    let logoId = settings?.receipt?.receiptLogo?.id || settings?.receipt?.receiptLogo || null

    // Upload logo if changed
    if (logoFile) {
      const formData = new FormData()
      formData.append('file', logoFile)
      formData.append('_payload', JSON.stringify({ alt: 'Receipt Logo' }))

      const uploadRes = await fetch('/api/media', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      if (uploadRes.ok) {
        const mediaDoc = await uploadRes.json()
        logoId = mediaDoc.doc.id
      }
    }

    const body = {
      fees: {
        collectionFeePercent: Number(collectionFeePercent),
        summonsFeeBelizeCity: Number(summonsFeeBelizeCity),
        summonsFeeOther: Number(summonsFeeOther),
        courtFilingFee: Number(courtFilingFee),
      },
      receipt: {
        companyName,
        companyAddress,
        companyPhone,
        companyEmail,
        companyWebsite,
        receiptFooter,
        receiptLogo: logoId || undefined,
      },
    }

    const method = settings?.id ? 'PATCH' : 'POST'
    const url = settings?.id ? `/api/crm-settings/${settings.id}` : '/api/crm-settings'

    const res = await fetch(url, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      showToast('Settings saved!')
    } else {
      showToast('Failed to save', 'error')
    }
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Fee Settings */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">💰 Fee Configuration</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Collection Fee (%)
            </label>
            <div className="relative">
              <input
                type="number"
                value={collectionFeePercent}
                onChange={(e) => setCollectionFeePercent(e.target.value)}
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
              />
              <span className="absolute right-3 top-2 text-gray-500">%</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Summons Fee - Belize City ($)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                value={summonsFeeBelizeCity}
                onChange={(e) => setSummonsFeeBelizeCity(e.target.value)}
                min="0"
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Summons Fee - Other ($)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                value={summonsFeeOther}
                onChange={(e) => setSummonsFeeOther(e.target.value)}
                min="0"
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Court Filing Fee ($)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                value={courtFilingFee}
                onChange={(e) => setCourtFilingFee(e.target.value)}
                min="0"
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Branding */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">📄 Receipt & Report Branding</h2>

        {/* Logo Upload */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Company Logo
          </label>
          <div className="flex items-center gap-4">
            {logoPreview && (
              <img
                src={logoPreview}
                alt="Logo preview"
                className="h-16 w-auto object-contain border rounded-lg p-2 bg-white"
              />
            )}
            <label className="cursor-pointer px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm hover:bg-blue-100">
              {logoPreview ? 'Change Logo' : 'Upload Logo'}
              <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Company Name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Address
            </label>
            <input
              type="text"
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone
            </label>
            <input
              type="text"
              value={companyPhone}
              onChange={(e) => setCompanyPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={companyEmail}
              onChange={(e) => setCompanyEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Website
            </label>
            <input
              type="text"
              value={companyWebsite}
              onChange={(e) => setCompanyWebsite(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Receipt Footer Text
          </label>
          <textarea
            value={receiptFooter}
            onChange={(e) => setReceiptFooter(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 resize-y"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
      >
        {submitting ? 'Saving...' : 'Save Settings'}
      </button>
    </form>
  )
}
