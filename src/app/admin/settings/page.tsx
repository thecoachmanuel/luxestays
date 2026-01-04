"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray, FormProvider, Controller } from "react-hook-form"
import { Loader2, Save, Plus, Trash2, Upload, RotateCcw, Send } from "lucide-react"
import { AppSettings } from "@/types"
import { FooterEditor } from "@/components/admin/FooterEditor"
import { AboutPageEditor } from "@/components/admin/AboutPageEditor"
import { CustomPageEditor } from "@/components/admin/CustomPageEditor"
import { SeoEditor } from "@/components/admin/SeoEditor"
import { RichTextEditor } from "@/components/admin/RichTextEditor"

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [message, setMessage] = useState("")
  const [testEmailAddress, setTestEmailAddress] = useState("")
  const [isTestingEmail, setIsTestingEmail] = useState(false)

  const methods = useForm<AppSettings>({
    defaultValues: {
      customPages: [],
      emailSettings: {
        provider: 'mock',
        fromName: 'LuxeStays',
        fromEmail: 'noreply@example.com'
      },
      welcomeEmail: {
        enabled: true,
        subject: 'Welcome to our platform!',
        body: 'Hi {{name}},\n\nThanks for joining us! We are excited to have you on board.\n\nBest,\nThe Team'
      }
    }
  })

  const { register, control, handleSubmit, reset, setValue, watch } = methods

  const appLogo = watch("appLogo")

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    setUploadingLogo(true)
    const file = e.target.files[0]
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) throw new Error("Upload failed")

      const data = await res.json()
      setValue("appLogo", data.url, { shouldValidate: true })
    } catch (err) {
      alert("Failed to upload logo")
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleEditorImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) throw new Error("Upload failed")

      const data = await res.json()
      return data.url
    } catch (err) {
      alert("Failed to upload image")
      throw err
    }
  }

  const { fields, append, remove } = useFieldArray({
    control,
    name: "customPages"
  })

  const insertFormatting = (index: number, startTag: string, endTag: string) => {
    const textarea = document.getElementById(`content-${index}`) as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = textarea.value
    const before = text.substring(0, start)
    const selection = text.substring(start, end)
    const after = text.substring(end)

    const newText = before + startTag + selection + endTag + after
    setValue(`customPages.${index}.content`, newText)
    
    // Defer focus restoration to ensure React has updated the value
    setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + startTag.length, end + startTag.length)
    }, 0)
  }

  const Toolbar = ({ index }: { index: number }) => (
    <div className="flex gap-2 mb-2 p-2 bg-[var(--secondary)]/10 rounded-t-md border-b border-[var(--secondary)]/20">
        <button type="button" onClick={() => insertFormatting(index, "**", "**")} className="p-1 hover:bg-[var(--secondary)]/20 rounded font-bold" title="Bold">B</button>
        <button type="button" onClick={() => insertFormatting(index, "*", "*")} className="p-1 hover:bg-[var(--secondary)]/20 rounded italic" title="Italic">I</button>
        <button type="button" onClick={() => insertFormatting(index, "# ", "")} className="p-1 hover:bg-[var(--secondary)]/20 rounded font-bold" title="Heading 1">H1</button>
        <button type="button" onClick={() => insertFormatting(index, "## ", "")} className="p-1 hover:bg-[var(--secondary)]/20 rounded font-bold" title="Heading 2">H2</button>
        <button type="button" onClick={() => insertFormatting(index, "- ", "")} className="p-1 hover:bg-[var(--secondary)]/20 rounded" title="List">• List</button>
    </div>
  )

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        reset(data)
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [reset])

  const onSubmit = async (data: AppSettings) => {
    setIsSaving(true)
    setMessage("")
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      
      if (res.ok) {
        setMessage("Settings saved successfully!")
        // Reload to reflect changes in Navbar/Layout
        setTimeout(() => window.location.reload(), 1000)
      } else {
        setMessage("Failed to save settings.")
      }
    } catch (error) {
      setMessage("Error saving settings.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetColors = () => {
    if (confirm("Are you sure you want to reset the color palette to defaults?")) {
        setValue("colorPalette", {
            brand: '#000000',
            secondary: '#4B5563',
            accent: '#2563EB',
            background: '#FFFFFF',
            text: '#111827'
        }, { shouldDirty: true });
    }
  }

  const handleTestEmail = async () => {
    if (!testEmailAddress) {
        alert("Please enter a recipient email address")
        return
    }

    const currentSettings = watch("emailSettings")
    setIsTestingEmail(true)
    
    try {
        const res = await fetch("/api/email/test", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                emailSettings: currentSettings,
                to: testEmailAddress
            })
        })

        const data = await res.json()

        if (res.ok) {
            alert(data.message || "Test email sent successfully!")
        } else {
            alert("Failed: " + (data.error || "Unknown error"))
        }
    } catch (error) {
        alert("Error sending test email")
    } finally {
        setIsTestingEmail(false)
    }
  }

  const [activeTab, setActiveTab] = useState<'general' | 'footer' | 'pages' | 'email' | 'appearance' | 'about' | 'seo'>('general')

  return (
    <FormProvider {...methods}>
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Settings</h1>
        <button
          onClick={handleSubmit(onSubmit)}
          disabled={isSaving}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[var(--brand)] text-[var(--background)] px-6 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 font-medium transition-all shadow-sm"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </button>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-md ${message.includes("success") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message}
        </div>
      )}

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 border-b">
        <button 
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 rounded-md whitespace-nowrap transition-colors ${activeTab === 'general' ? 'bg-[var(--brand)] text-[var(--background)]' : 'hover:bg-[var(--secondary)]/10'}`}
        >
            General & Branding
        </button>
        <button 
            onClick={() => setActiveTab('footer')}
            className={`px-4 py-2 rounded-md whitespace-nowrap transition-colors ${activeTab === 'footer' ? 'bg-[var(--brand)] text-[var(--background)]' : 'hover:bg-[var(--secondary)]/10'}`}
        >
            Footer
        </button>
        <button 
            onClick={() => setActiveTab('about')}
            className={`px-4 py-2 rounded-md whitespace-nowrap transition-colors ${activeTab === 'about' ? 'bg-[var(--brand)] text-[var(--background)]' : 'hover:bg-[var(--secondary)]/10'}`}
        >
            About Page
        </button>
        <button 
            onClick={() => setActiveTab('pages')}
            className={`px-4 py-2 rounded-md whitespace-nowrap transition-colors ${activeTab === 'pages' ? 'bg-[var(--brand)] text-[var(--background)]' : 'hover:bg-[var(--secondary)]/10'}`}
        >
            Custom Pages
        </button>
        <button 
            onClick={() => setActiveTab('email')}
            className={`px-4 py-2 rounded-md whitespace-nowrap transition-colors ${activeTab === 'email' ? 'bg-[var(--brand)] text-[var(--background)]' : 'hover:bg-[var(--secondary)]/10'}`}
        >
            Email Configuration
        </button>
        <button 
            onClick={() => setActiveTab('appearance')}
            className={`px-4 py-2 rounded-md whitespace-nowrap transition-colors ${activeTab === 'appearance' ? 'bg-[var(--brand)] text-[var(--background)]' : 'hover:bg-[var(--secondary)]/10'}`}
        >
            Appearance
        </button>
        <button 
            onClick={() => setActiveTab('seo')}
            className={`px-4 py-2 rounded-md whitespace-nowrap transition-colors ${activeTab === 'seo' ? 'bg-[var(--brand)] text-[var(--background)]' : 'hover:bg-[var(--secondary)]/10'}`}
        >
            SEO & Meta
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--secondary)]/50" />
        </div>
      ) : (
        <div className="space-y-8">
            {activeTab === 'general' && (
                <div className="space-y-6 border border-[var(--secondary)]/20 p-6 rounded-lg bg-[var(--background)] shadow-sm">
                    <div className="border-b border-[var(--secondary)]/20 pb-4">
                        <h3 className="text-lg font-semibold text-[var(--foreground)]">General Information</h3>
                        <p className="text-sm text-[var(--secondary)]">Configure basic site details</p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div>
                        <label className="block text-sm font-medium text-[var(--foreground)]">App Name</label>
                        <input
                            {...register("appName", { required: true })}
                            className="mt-1 block w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)] transition-colors"
                        />
                        </div>
                        <div>
                        <label className="block text-sm font-medium text-[var(--foreground)]">Contact Email</label>
                        <input
                            {...register("contactEmail")}
                            type="email"
                            className="mt-1 block w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)] transition-colors"
                        />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground)]">Business Address</label>
                            <textarea
                                {...register("address")}
                                rows={3}
                                className="mt-1 block w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)] transition-colors"
                                placeholder="123 Luxury Lane, City, Country"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--foreground)]">App Logo</label>
                        <div className="mt-2 flex items-center gap-4">
                        {appLogo && (
                            <div className="h-16 w-16 relative rounded-lg border border-[var(--secondary)]/20 overflow-hidden bg-[var(--secondary)]/5">
                                <img src={appLogo} alt="Logo" className="h-full w-full object-contain" />
                            </div>
                        )}
                        <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-[var(--secondary)]/20 rounded-md hover:bg-[var(--secondary)]/10 transition-colors">
                            <Upload className="h-4 w-4 text-[var(--foreground)]" />
                            <span className="text-sm font-medium text-[var(--foreground)]">Upload New Logo</span>
                            <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={handleLogoUpload}
                                disabled={uploadingLogo}
                            />
                        </label>
                        {uploadingLogo && <Loader2 className="h-4 w-4 animate-spin text-[var(--secondary)]" />}
                        </div>
                    </div>

                    <div className="border-t border-[var(--secondary)]/20 pt-6">
                        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Payment Configuration</h3>
                        <div className="grid gap-6 md:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground)]">Paystack Public Key</label>
                            <input
                            {...register("paystackPublicKey")}
                            className="mt-1 block w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)] font-mono text-sm"
                            placeholder="pk_test_..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground)]">Paystack Secret Key</label>
                            <input
                            {...register("paystackSecretKey")}
                            type="password"
                            className="mt-1 block w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)] font-mono text-sm"
                            placeholder="sk_test_..."
                            />
                        </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-[var(--secondary)]/20">
                        <button
                            type="button"
                            onClick={handleSubmit(onSubmit)}
                            disabled={isSaving}
                            className="flex items-center justify-center gap-2 bg-[var(--brand)] text-[var(--background)] px-6 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 font-medium transition-all shadow-sm"
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Save Appearance
                        </button>
                         <button
                            type="button"
                            onClick={handleResetColors}
                            className="flex items-center justify-center gap-2 bg-[var(--background)] text-[var(--foreground)] border border-[var(--secondary)]/20 px-6 py-2.5 rounded-lg hover:bg-[var(--secondary)]/10 font-medium transition-all shadow-sm"
                        >
                            <RotateCcw className="h-4 w-4" />
                            Reset to Defaults
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'footer' && (
                <FooterEditor control={control} register={register} />
            )}

            {activeTab === 'about' && (
                <AboutPageEditor control={control} register={register} setValue={setValue} watch={watch} />
            )}

            {activeTab === 'email' && (
                <div className="space-y-8">
                    {/* Email Service Configuration */}
                    <div className="border border-[var(--secondary)]/20 p-6 rounded-lg bg-[var(--background)] shadow-sm">
                         <div className="border-b border-[var(--secondary)]/20 pb-4 mb-6">
                            <h3 className="text-lg font-semibold text-[var(--foreground)]">Email Service Provider</h3>
                            <p className="text-sm text-[var(--secondary)]">Configure how emails are sent from your application</p>
                        </div>
                        
                        <div className="grid gap-6 md:grid-cols-2 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-[var(--foreground)]">Provider</label>
                                <select 
                                    {...register("emailSettings.provider")}
                                    className="mt-1 block w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)]"
                                >
                                    <option value="mock">Mock / Log (Dev)</option>
                                    <option value="smtp">SMTP (Requires Nodemailer)</option>
                                    <option value="resend">Resend API</option>
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-[var(--foreground)]">From Name</label>
                                <input
                                    {...register("emailSettings.fromName")}
                                    className="mt-1 block w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)]"
                                    placeholder="Apartment Booking"
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-[var(--foreground)]">From Email</label>
                                <input
                                    {...register("emailSettings.fromEmail")}
                                    className="mt-1 block w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)]"
                                    placeholder="noreply@yourdomain.com"
                                />
                            </div>
                        </div>

                        {watch("emailSettings.provider") === 'smtp' && (
                            <div className="space-y-4 border-t border-[var(--secondary)]/20 pt-4">
                                <p className="text-sm text-[var(--secondary)] bg-[var(--secondary)]/10 p-2 rounded">Note: SMTP requires <code>nodemailer</code> package to be installed on the server.</p>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <input {...register("emailSettings.host")} placeholder="SMTP Host" className="border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] rounded p-2 w-full" />
                                    <input {...register("emailSettings.port", { valueAsNumber: true })} type="number" placeholder="SMTP Port" className="border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] rounded p-2 w-full" />
                                    <input {...register("emailSettings.user")} placeholder="SMTP User" className="border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] rounded p-2 w-full" />
                                    <input {...register("emailSettings.password")} type="password" placeholder="SMTP Password" className="border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] rounded p-2 w-full" />
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <input 
                                        type="checkbox" 
                                        {...register("emailSettings.secure")} 
                                        id="smtp-secure"
                                        className="h-4 w-4 rounded border-[var(--secondary)]/20 text-[var(--brand)] focus:ring-[var(--brand)]"
                                    />
                                    <label htmlFor="smtp-secure" className="text-sm font-medium text-[var(--foreground)]">Use Secure Connection (TLS/SSL) - Check for port 465</label>
                                </div>
                            </div>
                        )}

                        {watch("emailSettings.provider") === 'resend' && (
                             <div className="space-y-4 border-t border-[var(--secondary)]/20 pt-4">
                                <div className="grid gap-4">
                                    <label className="block text-sm font-medium text-[var(--foreground)]">Resend API Key</label>
                                    <input {...register("emailSettings.apiKey")} type="password" placeholder="re_123..." className="border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] rounded p-2 w-full" />
                                </div>
                            </div>
                        )}

                        <div className="mt-6 pt-6 border-t border-[var(--secondary)]/20">
                            <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Test Configuration</h4>
                            <div className="flex gap-2">
                                <input 
                                    type="email" 
                                    placeholder="Enter recipient email" 
                                    value={testEmailAddress}
                                    onChange={(e) => setTestEmailAddress(e.target.value)}
                                    className="flex-grow rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)]"
                                />
                                <button
                                    type="button"
                                    onClick={handleTestEmail}
                                    disabled={isTestingEmail || !testEmailAddress}
                                    className="flex items-center gap-2 bg-[var(--secondary)] text-[var(--background)] px-4 py-2 rounded-md hover:bg-[var(--secondary)]/80 disabled:opacity-50 transition-colors"
                                >
                                    {isTestingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    Send Test
                                </button>
                            </div>
                            <p className="text-xs text-[var(--secondary)] mt-2">
                                Save your settings before testing is not required. This test uses the values currently entered in the form.
                            </p>
                        </div>
                    </div>

                    {/* Welcome Email Configuration */}
                    <div className="border border-[var(--secondary)]/20 p-6 rounded-lg bg-[var(--background)] shadow-sm">
                        <div className="border-b border-[var(--secondary)]/20 pb-4 mb-6">
                            <h3 className="text-lg font-semibold text-[var(--foreground)]">Automatic Welcome Email</h3>
                            <p className="text-sm text-[var(--secondary)]">Configure the email sent to new users upon registration</p>
                        </div>

                        <div className="space-y-4">
                             <div className="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    {...register("welcomeEmail.enabled")} 
                                    id="welcome-enabled"
                                    className="h-4 w-4 rounded border-[var(--secondary)]/20 text-[var(--brand)] focus:ring-[var(--brand)]"
                                />
                                <label htmlFor="welcome-enabled" className="text-sm font-medium text-[var(--foreground)]">Enable Welcome Email</label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--foreground)]">Subject</label>
                                <input
                                    {...register("welcomeEmail.subject")}
                                    className="mt-1 block w-full rounded-md border border-[var(--secondary)]/20 bg-[var(--background)] text-[var(--foreground)] px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)]"
                                />
                            </div>

                             <div>
                                <label className="block text-sm font-medium text-[var(--foreground)]">Body</label>
                                <p className="text-xs text-[var(--secondary)] mb-1">
                                    Available variables: <code>{'{{name}}'}</code>, <code>{'{{appName}}'}</code>, <code>{'{{logoOrTitle}}'}</code>, <code>{'{{siteUrl}}'}</code>, <code>{'{{heroImage}}'}</code>, <code>{'{{address}}'}</code>, <code>{'{{socialLinks}}'}</code>
                                </p>
                                <div className="border border-[var(--secondary)]/20 rounded-md bg-white text-black">
                                    <Controller
                                        name="welcomeEmail.body"
                                        control={control}
                                        render={({ field }) => (
                                            <RichTextEditor
                                                value={field.value || ""}
                                                onChange={field.onChange}
                                                onImageUpload={handleEditorImageUpload}
                                                className="min-h-[400px] bg-white text-black"
                                            />
                                        )}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'pages' && (
                <div className="space-y-6">
                    {fields.map((field, index) => (
                        <CustomPageEditor
                            key={field.id}
                            index={index}
                            register={register}
                            control={control}
                            watch={watch}
                            setValue={setValue}
                            remove={remove}
                        />
                    ))}

                    <button
                    type="button"
                    onClick={() => append({ 
                        id: crypto.randomUUID(), 
                        slug: "", 
                        title: "New Page", 
                        content: "",
                        template: 'default',
                        data: {
                            subtitle: "",
                            heroImage: ""
                        }
                    })}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[var(--secondary)]/30 p-8 text-[var(--secondary)] hover:border-[var(--secondary)] hover:text-[var(--foreground)] transition-colors"
                    >
                    <Plus className="h-6 w-6" />
                    <span className="font-medium">Add New Page</span>
                    </button>
                </div>
            )}

            {activeTab === 'appearance' && (
                <div className="space-y-6 border p-6 rounded-lg bg-[var(--background)] shadow-sm">
                    <div className="border-b pb-4">
                        <h3 className="text-lg font-semibold text-[var(--foreground)]">Global Color Palette</h3>
                        <p className="text-sm text-[var(--secondary)]">Customize the colors of your website.</p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Brand Color (Primary)</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    {...register("colorPalette.brand")}
                                    className="h-10 w-10 rounded border p-1 cursor-pointer"
                                />
                                <input
                                    {...register("colorPalette.brand")}
                                    className="block w-full rounded-md border border-[var(--secondary)]/30 px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)] uppercase"
                                />
                            </div>
                            <p className="text-xs text-[var(--secondary)] mt-1">Used for buttons, links, and highlights.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Secondary Color</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    {...register("colorPalette.secondary")}
                                    className="h-10 w-10 rounded border p-1 cursor-pointer"
                                />
                                <input
                                    {...register("colorPalette.secondary")}
                                    className="block w-full rounded-md border border-[var(--secondary)]/30 px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)] uppercase"
                                />
                            </div>
                             <p className="text-xs text-[var(--secondary)] mt-1">Used for secondary actions and borders.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Accent Color</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    {...register("colorPalette.accent")}
                                    className="h-10 w-10 rounded border p-1 cursor-pointer"
                                />
                                <input
                                    {...register("colorPalette.accent")}
                                    className="block w-full rounded-md border border-[var(--secondary)]/30 px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)] uppercase"
                                />
                            </div>
                             <p className="text-xs text-[var(--secondary)] mt-1">Used for notifications and badges.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Background Color</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    {...register("colorPalette.background")}
                                    className="h-10 w-10 rounded border p-1 cursor-pointer"
                                />
                                <input
                                    {...register("colorPalette.background")}
                                    className="block w-full rounded-md border border-[var(--secondary)]/30 px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)] uppercase"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Text Color</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    {...register("colorPalette.text")}
                                    className="h-10 w-10 rounded border p-1 cursor-pointer"
                                />
                                <input
                                    {...register("colorPalette.text")}
                                    className="block w-full rounded-md border border-[var(--secondary)]/30 px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)] uppercase"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'seo' && (
                <SeoEditor />
            )}
        </div>
      )}
    </div>
    </FormProvider>
  )
}
